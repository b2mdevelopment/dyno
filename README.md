## Dyno

![](https://travis-ci.org/mapbox/dyno.svg)

The aws-sdk dynamo client is very close to the API, dyno tries to help reduce the
amount of repetitive code needed to interact with dynamodb.

First it guesses types. Dynamo is very specific about its types:

```
{key:{S: 'value'}}
```

in dyno can be written like:

```
{key:'value'}
```

When dyno doesn't do anything to improve a command, it simply passes it through to
[aws-sdk dynamodb client](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html).

This is the case right now with commands like `scan`


#### Installing

```
 npm install dyno -S
```

### Usage

#### CLI

Dyno includes a cli for working with DynamoDB tables.

##### Setup

Dyno assumes that credentials for AWS will be provided in the ENVIRONMENT as [described in the aws-sdk docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Credentials_from_Environment_Variables)

##### Common flags:

```
dyno tables -e <Endpoint URL> -r <region>

dyno tables -e http://localhost:4567
```


##### List tables:

```
dyno tables

{"TableNames":['my-table', 'my-other-table']}

```

##### Describe a table:

```
dyno table my-table

{"Table":{"AttributeDefinitions":[{"AttributeName":"collection","AttributeType":"S"},....]}}

```

##### Scan a table:

Outputs line delimited JSON for every item in the table.

```
dyno scan my-table

{"id":"0.9410678697749972","collection":"somethign:0","attr":"moredata 64"}
{"id":"0.9417226337827742","collection":"somethign:0","attr":"moredata 24"}
{"id":"0.9447696127463132","collection":"somethign:0","attr":"moredata 48"}
{"id":"0.9472108569461852","collection":"somethign:0","attr":"moredata 84"}
....

```

##### Export a table:

Outputs the table schema then does a scan (like above)

```
dyno export my-table

{"AttributeDefinitions":[{"AttributeName":"collection","AttributeType":"S"},...]}
{"id":"0.9410678697749972","collection":"somethign:0","attr":"moredata 64"}
{"id":"0.9417226337827742","collection":"somethign:0","attr":"moredata 24"}
{"id":"0.9447696127463132","collection":"somethign:0","attr":"moredata 48"}
{"id":"0.9472108569461852","collection":"somethign:0","attr":"moredata 84"}
....

```

##### Import a table:

Receives an exported table on stdin. Expects the first line to be the table schema, and
the rest of the lines to be items.

```
dyno export my-table | dyno import my-table-copy

```



#### JS api:


##### Setup

```
var dyno = module.exports.dyno = require('dyno')({
    accessKeyId: 'XXX',
    secretAccessKey: 'XXX',
    region: 'us-east-1',
    table: 'test'
});

```

##### putItem

```
var item = {id: 'yo', range: 5};
dyno.putItem(item, function(err, resp){});

// multiple items
var items = [
        {id: 'yo', range: 5},
        {id: 'guten tag', range: 5},
        {id: 'nihao', range: 5}
    ];
dyno.putItems(items, function(err, resp){})
```

Set the table name per command:

```
var item = {id: 'yo', range: 5};
dyno.putItem(item, {table:'myothertablename'}, function(err, resp){});

```

##### updateItem

```
var key = {id: 'yo', range:5};
var item = {put:{a: 'oh hai'}, add:{count: 1}};

dyno.updateItem(key, item, function(err, resp){});

```

##### deleteItems

```
var keys = [
        {id: 'yo', range: 5},
        {id: 'guten tag', range: 5},
        {id: 'nihao', range: 5}
    ];
dyno.deleteItems(keys, function(err, resp){})
```

##### query

```
var query = {id: {'EQ':'yo'}, {range:{'BETWEEN':[4,6]}};

dyno.query(query, function(err, resp){
    assert.deepEqual(resp, {count : 1, items : [{id : 'yo', range : 5 }]});
});

dyno.query(query, {attributes:['range']}, function(err, resp){
    assert.deepEqual(resp, {count : 1, items : [{range : 5 }]});
});

```

The last key evaluated by dynamodb can be found in the query callback's third
argument.

```
dyno.query(query, {pages: 1}, function(err, resp, metas) {
    next = metas.pop().last;
    ...
});
```

This key can be passed back in to another query to get the next page of
results.

```
dyno.query(query, {start: next, pages: 1}, function(err, resp, metas) {
    ...
});
```
