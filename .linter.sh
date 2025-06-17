#!/bin/bash
cd /home/kavia/workspace/code-generation/communityconnect-hub-59463-5b365d8c/communityconnect_hub
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

