#!/bin/bash
cd /home/kavia/workspace/code-generation/artvista-61521-3d103d35/artvista_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

