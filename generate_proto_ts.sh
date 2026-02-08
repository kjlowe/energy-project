#!/bin/bash
set -e

echo "🔧 Generating TypeScript types from billing.proto..."

# Create output directory
mkdir -p react-app/src/types/generated

# Generate TypeScript types
protoc \
  --plugin=./react-app/node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./react-app/src/types/generated \
  --ts_proto_opt=snakeToCamel=false \
  --ts_proto_opt=esModuleInterop=true \
  --ts_proto_opt=forceLong=string \
  --ts_proto_opt=outputJsonMethods=false \
  --ts_proto_opt=oneof=unions \
  --ts_proto_opt=useOptionals=messages \
  --proto_path=./proto \
  ./proto/billing.proto

echo "✅ TypeScript types generated with snake_case at react-app/src/types/generated/billing.ts"
