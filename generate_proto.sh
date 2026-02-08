#!/bin/bash
set -e

echo "📦 Generating protobuf code for all languages..."

# Python (betterproto)
echo "🐍 Generating Python protobuf..."
protoc -I proto --python_betterproto_out=python-app/proto proto/billing.proto

# TypeScript (ts-proto)
echo "📘 Generating TypeScript types..."
./generate_proto_ts.sh

echo "✅ All protobuf code generated successfully"
