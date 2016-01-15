#!/bin/bash

# Count from 1 to 10 with a sleep
for ((COUNT = 1; COUNT <= 10; COUNT++)); do
  echo $(quakestat -xonotics 91.121.112.160:26011 -P -xml -utf8 | tr -d "\n\r\t")
  sleep 5
done
