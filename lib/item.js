var _ = require('underscore');
var types = require('./types');

module.exports = function(config) {
    var items = {};
    var dynamoRequest = require('./dynamoRequest')(config);

    /**
     * Get an item from a table
     * @param {String} key key of the item to get
     * @param {Object} opts
     * @param {Function} cb callback
     */
    items.getItem = function(key, opts, cb) {
        if (!cb) {
            cb = opts;
            opts = {};
        }
        key = types.toDynamoTypes(key);
        var params = {
            Key: key,
            TableName: opts.table || config.table,
            ConsistentRead: opts.consistentRead || false
        };

        if (opts.capacity) params.ReturnConsumedCapacity = opts.capacity;

        return dynamoRequest('getItem', params, opts, function(err, items, meta) {
            if (err) return cb(err);
            cb(null, _(items).first(), _(meta).first());
        });
    };

    /**
     * Put an item into a table
     * @param {Object} doc document
     * @param {Object} opts
     * @param {Function} cb callback
     */
    items.putItem = function(doc, opts, cb) {
        if (!cb) {
            cb = opts;
            opts = {};
        }
        var item = types.toDynamoTypes(doc);
        var params = {
            TableName: opts.table || config.table,
            Item: item
        };

        if (opts.expected) params.Expected = types.conditions(opts.expected);
        if (opts.conditionalOperator) params.ConditionalOperator = opts.conditionalOperator;
        if (opts.capacity) params.ReturnConsumedCapacity = opts.capacity;

        return dynamoRequest('putItem', params, opts, function(err, resp, meta) {
            if (err) return cb(err);
            cb(null, doc, _(meta).first());
        });
    };

    /**
     * Update an item in a table
     * @param {String} key
     * @param {Object} doc document
     * @param {Object} opts
     * @param {Function} cb callback
     */
    items.updateItem = function(key, doc, opts, cb) {
        if (!cb) {
            cb = opts;
            opts = {};
        }
        var attrs = types.toAttributeUpdates(doc);
        var params = {
            TableName: opts.table || config.table,
            Key: types.toDynamoTypes(key),
            AttributeUpdates: attrs,
            ReturnValues: 'ALL_NEW'
        };

        if (opts.expected) params.Expected = types.conditions(opts.expected);
        if (opts.conditionalOperator) params.ConditionalOperator = opts.conditionalOperator;
        if (opts.capacity) params.ReturnConsumedCapacity = opts.capacity;

        return dynamoRequest('updateItem', params, opts, function(err, items, meta) {
            if (err) return cb(err);
            cb(null, _(items).first(), _(meta).first());
        });
    };

    /**
     * Delete an item from a table
     * @param {String} key
     * @param {Object} opts
     * @param {Function} cb callback
     */
    items.deleteItem = function(key, opts, cb) {
        if (!cb) {
            cb = opts;
            opts = {};
        }

        var params = {
            TableName: opts.table || config.table,
            Key: types.toDynamoTypes(key),
            ReturnValues: 'NONE'
        };
        if (opts.expected) params.Expected = types.conditions(opts.expected);
        if (opts.conditionalOperator) params.ConditionalOperator = opts.conditionalOperator;
        if (opts.capacity) params.ReturnConsumedCapacity = opts.capacity;

        return dynamoRequest('deleteItem', params, opts, function(err, items, meta) {
            if (err) return cb(err);
            cb(null, _(items).first(), _(meta).first());
        });
    };

    return items;
};
