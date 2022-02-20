{
  $jsonSchema: {
    required: [
      'video_id',
      'type'
    ],
    properties: {
      video_id: {
        bsonType: 'string',
        description: 'youtube videoID',
        minLength: 11,
        maxLength: 11
      },
      type: {
        bsonType: 'string',
        'enum': [
          'missed',
          'done',
          'incorrect'
        ]
      },
      missed: {
        type: 'array',
        minItems: 1,
        uniqueItems: true,
        items: {
          bsonType: 'object',
          required: [
            'start',
            'end',
            'category',
            'probability',
            'probabilities',
            'text'
          ],
          properties: {
            start: {
              bsonType: [
                'double',
                'int'
              ]
            },
            end: {
              bsonType: [
                'double',
                'int'
              ]
            },
            category: {
              bsonType: 'string',
              'enum': [
                'INCORRECT',
                'SELFPROMO',
                'SPONSOR',
                'INTERACTION',
                'null'
              ]
            },
            probability: {
              bsonType: 'double'
            },
            probabilities: {
              bsonType: [
                'object'
              ],
              properties: {
                null: {
                  bsonType: [
                    'double',
                    'int'
                  ]
                },
                SPONSOR: {
                  bsonType: [
                    'double',
                    'int'
                  ]
                },
                SELFPROMO: {
                  bsonType: [
                    'double',
                    'int'
                  ]
                },
                INTERACTION: {
                  bsonType: [
                    'double',
                    'int'
                  ]
                }
              }
            },
            text: {
              bsonType: 'string'
            }
          }
        }
      },
      batch: {
        bsonType: 'string',
        minLength: 5,
        maxLength: 5
      }
    }
  }
}