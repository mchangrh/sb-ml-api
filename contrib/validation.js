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
          'incorrect',
          'rejected'
        ]
      },
      incorrect: {
        type: 'array',
        uniqueItems: true,
        items: {
          bsonType: 'object',
          properties: {
            uuid: {
              bsonType: 'string',
              maxLength: 65
            },
            start: {
              bsonType: [
                'double',
                'int'
              ],
              minimum: 0
            },
            end: {
              bsonType: [
                'double',
                'int'
              ]
            },
            votes: {
              bsonType: 'int',
              minimum: -2
            },
            locked: {
              bsonType: 'bool'
            },
            views: {
              bsonType: 'int',
              minimum: 0
            },
            category: {
              bsonType: 'string',
              'enum': [
                'selfpromo',
                'sponsor',
                'interaction'
              ]
            },
            text: {
              bsonType: 'string'
            },
            submission_time: {
              bsonType: [
                'double',
                'int'
              ]
            },
            reputation: {
              bsonType: [
                'int',
                'double'
              ],
              maximum: 27
            },
            action: {
              bsonType: 'string'
            }
          }
        }
      },
      missed: {
        type: 'array',
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