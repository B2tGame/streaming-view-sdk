#!/bin/bash
set -e
# Def
WEBRTC=./
PROTO_DEST=./src/proto
PROTOC_PLUGIN=./protoc-plugin

# Cleanup steps
rm -rf $WEBRTC/src/proto
rm -f $PROTOC_PLUGIN/grpc_generator.o
rm -f $PROTOC_PLUGIN/protoc-gen-grpc-web
rm -rf $WEBRTC/node_modules
rm -rf $WEBRTC/emulator

# Create protobuf tool.
g++ -std=c++11 -I/usr/local/include -pthread -I/usr/include  -c -o $PROTOC_PLUGIN/grpc_generator.o $PROTOC_PLUGIN/grpc_generator.cc
g++ $PROTOC_PLUGIN/grpc_generator.o -L/usr/local/lib -L/usr/lib -lprotoc -lprotobuf -lpthread -ldl -o $PROTOC_PLUGIN/protoc-gen-grpc-web

# Create protobuf javascript files.
mkdir -p $WEBRTC/src/proto
for PROTO_FILE in ./protobuf-definition/*.proto; do
    FILE_NAME=$(basename $PROTO_FILE .proto);
    protoc \
        -I/usr/local/include \
        -I./protobuf-definition/ \
        -I$PROTO_DEST \
    		--plugin=protoc-gen-grpc-web=$PROTOC_PLUGIN/protoc-gen-grpc-web \
    		--js_out=import_style=commonjs:$PROTO_DEST \
    		--grpc-web_out=import_style=commonjs,mode=grpcwebtext:$PROTO_DEST \
    		./protobuf-definition/$FILE_NAME.proto
    python $WEBRTC/eslint_prefix.py $PROTO_DEST/${FILE_NAME}_pb.js
done

# Copy web-client version
if [ -f "$PROTO_DEST/rtc_service_pb.js" ]; then
  cp $WEBRTC/ext/emulator_web_client_v2.js $PROTO_DEST/emulator_web_client.js;
else
  cp $WEBRTC/ext/emulator_web_client_v1.js $PROTO_DEST/emulator_web_client.js;
fi

# Download and install NPM deps and build project
pushd $WEBRTC
npm install
npm run build
popd


# Final cleanup of temporay files:
rm -rf $WEBRTC/src/proto
rm -f $PROTOC_PLUGIN/grpc_generator.o
rm -f $PROTOC_PLUGIN/protoc-gen-grpc-web
rm -rf $WEBRTC/node_modules
