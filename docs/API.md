# API Endpoints
```ts
{
  "/get": {
    description: "Get random segment suggestions",
    request: {
      video_id: {
        description: "Get suggestions for specific videoID"
        type: string,
        required: false
      }
    },
    response: {
      video_id: string,
      missed: [{ // array of this item
        start: number,
        end: number,
        category: string,
        probability: number,
        probabilities: [{
          null: number,
          SPONSOR: number,
          SELFPROMO: number,
          INTERACTION: number,
        }],
        text: string,
      }]
    }
  },
  "/done": {
    description: "Mark suggestion as done",
    request: {
      video_id: {
        description: "videoID to mark as done"
        type: string,
        required: true
      }
    },
    response: {
      acknowledged: boolean,
      modifiedCount: number,
      matchedCount: number
    }
  },
  "/reject": {
    description: "Mark suggestion as incorrect",
    request: {
      video_id: {
        description: "videoID to mark as incorrect"
        type: string,
        required: true
      }
    },
    response: {
      acknowledged: boolean,
      matchedCount: number,
      modifiedCount: number
    }
  },
  "/load": {
    description: "Load new suggestions",
    request: {
      body: string
    },
    responses: {
      "ok": {
        ok: boolean,
        inserted: number,
        jsonErrors: number,
        input: number
      },
      "duplicates": {
        ok: boolean,
        code: number,
        inserted: number,
        jsonErrors: number,
        writeErrors: number,
        input: number
      },
      "error": {
        ok: boolean,
        code: number,
        jsonErrors: number,
        input: number
      }
    }
  }
}
```