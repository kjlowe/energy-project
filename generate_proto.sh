#!/bin/bash
set -e

echo "📦 Generating protobuf code for all languages..."

# Python (betterproto)
echo "🐍 Generating Python protobuf..."
protoc -I proto --python_betterproto_out=python-app/proto proto/billing.proto
protoc -I proto --python_betterproto_out=python-app/proto proto/metadata.proto
protoc -I proto --python_betterproto_out=python-app/proto proto/tariff.proto

# TypeScript (ts-proto)
echo "📘 Generating TypeScript types..."
mkdir -p react-app/src/types/generated

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
  ./proto/metadata.proto

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
  ./proto/tariff.proto

echo "✅ All protobuf code generated successfully"
echo "   - Python: python-app/proto/billing.py"
echo "   - Python: python-app/proto/metadata.py"
echo "   - Python: python-app/proto/tariff.py"
echo "   - TypeScript: react-app/src/types/generated/billing.ts"
echo "   - TypeScript: react-app/src/types/generated/metadata.ts"
echo "   - TypeScript: react-app/src/types/generated/tariff.ts"
