#!/bin/bash
upload () {
  AUTH=test
  curl --data-binary "@$1" -H "content-type: text/plain" https://ml.sb.mchang.xyz/ml/load?auth=$AUTH
}