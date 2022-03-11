#!/bin/bash
upload () {
  AUTH=test
  curl --data-binary "@$1" -H "content-type: text/plain" https://sb-ml.mchang.xyz/ml/load?auth=$AUTH
}