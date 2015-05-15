var AWS = require('aws-sdk');
var test = require('tape');
var _ = require('underscore');
var Emitter = require('events').EventEmitter;
var stream = require('stream');

var totalPages = Infinity;

// Mock DynamoDB to scan items forever
AWS.DynamoDB = function() {
    this.pages = 0;
};
AWS.DynamoDB.prototype.config = { update: function() {} };
AWS.DynamoDB.prototype.scan = function(parameters, callback) {
    var records = _.range(1000).map(function() {
        return {
            id: { S: 'does not matter' },
            range: { S: 'whatever' }
        };
    });

    var response = {
        Items: records,
        LastEvaluatedKey: records[999].id
    };

    this.pages++;
    if (this.pages === totalPages) delete response.LastEvaluatedKey;

    setTimeout(callback, Math.random() * 1000, null, response);

    return new Emitter();
};

var Dyno = require('..');

function throttle(timeout, options) {
    options = options || {};
    options.objectMode = true;
    var writer = new stream.Transform(options);
    writer._transform = function(chunk, enc, callback) {
        setTimeout(function() {
            writer.emit('_transform');
            writer.push(chunk);
            callback();
        }, timeout);
    };
    return writer;
}

function deadend(timeout, options) {
    options = options || {};
    options.objectMode = true;
    var writer = new stream.Writable(options);
    writer._write = function(chunk, enc, callback) {
        setTimeout(function() {
            writer.emit('_write');
            callback();
        }, timeout);
    };
    return writer;
}

test('scan two pages', function(assert) {
    var dyno = Dyno({ region: 'fake', table: 'fake' });

    dyno.scan({ pages: 2 }, function(err, data) {
        assert.ifError(err, 'mock dynamodb works');
        assert.equal(data.length, 2000, 'got 2000 records');
        assert.end();
    });
});

test('scan the entire table via stream', function(assert) {
    var dyno = Dyno({ region: 'fake', table: 'fake' });
    var records = 0;
    totalPages = 3;

    dyno.scan()
        .on('data', function() { records++; })
        .on('end', function() {
            assert.equal(records, 3000, 'got 3000 records');
            assert.end();
        });
});

test('scan reaches highWaterMark', function(assert) {
    assert.timeoutAfter(999999999);
    var dyno = Dyno({ region: 'fake', table: 'fake' });
    var records = 0;
    totalPages = Infinity;

    var through = throttle(1);
    var cap = deadend(100000);
    var scanner = dyno.scan();
    scanner
        .pipe(through)
        .pipe(cap);
});
