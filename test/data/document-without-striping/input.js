exports['document-without-striping'] = exports['document-without-striping'] || {};

exports['document-without-striping'].input = {
    "posts": {
        "id": "1",
        "title": "Rails is Omakase",
        "links": {
            "author": {
                "id": "9",
                "type": "people"
            }
        }
    },
    "linked": {
        "people": [{
            "id": "9",
            "name": "@d2h"
        }]
    }
};
