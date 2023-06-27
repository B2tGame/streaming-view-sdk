#!/bin/bash
set -e

# Get current abs path
SCRIPTPATH=`dirname $(readlink -f $0)`

# Def
WEBRTC="$SCRIPTPATH/.."
PROTO_DEST="$WEBRTC/src/controllers/proto"
PROTOC_PLUGIN="$WEBRTC/protoc-plugin"
PROTO_DEFS="$WEBRTC/protobuf-definition"


# Cleanup steps
rm -rf $WEBRTC/src/controllers/proto
rm -f $PROTOC_PLUGIN/grpc_generator.o
rm -f $PROTOC_PLUGIN/protoc-gen-grpc-web
# rm -rf $WEBRTC/node_modules
rm -rf $WEBRTC/emulator

# Create protobuf tool.
echo "A"
g++ -std=c++11 -I/usr/local/include -pthread -I/usr/include  -c -o $PROTOC_PLUGIN/grpc_generator.o $PROTOC_PLUGIN/grpc_generator.cc
echo "B"
g++ $PROTOC_PLUGIN/grpc_generator.o -L/usr/local/lib -L/usr/lib -lprotoc -lprotobuf -lpthread -ldl -o $PROTOC_PLUGIN/protoc-gen-grpc-web

# Create protobuf javascript files.
mkdir -p $PROTO_DEST

for PROTO_FILE in $PROTO_DEFS/*.proto; do
    FILE_NAME=$(basename $PROTO_FILE .proto);
    echo "$FILE_NAME"
    protoc \
        -I/usr/local/include \
        -I./protobuf-definition/ \
        -I$PROTO_DEST/ \
    		--plugin=protoc-gen-grpc-web=$PROTOC_PLUGIN/protoc-gen-grpc-web \
    		--js_out=import_style=commonjs:$PROTO_DEST/ \
    		--grpc-web_out=import_style=typescript,mode=grpcwebtext:$PROTO_DEST/ \
    		./protobuf-definition/$FILE_NAME.proto
    # python3 $WEBRTC/eslint_prefix.py $PROTO_DEST/${FILE_NAME}_pb.js
done

# Copy web-client version
if [ -f "$PROTO_DEST/rtc_service_pb.js" ]; then
  cp $WEBRTC/ext/emulator_web_client_v2.ts $PROTO_DEST/emulator_web_client.ts;
else
  cp $WEBRTC/ext/emulator_web_client_v1.ts $PROTO_DEST/emulator_web_client.ts;
fi

# npm remove ts-proto
# Final cleanup of temporay files:
# rm -f $PROTOC_PLUGIN/grpc_generator.o
rm -f $PROTOC_PLUGIN/protoc-gen-grpc-web
rm -rf $WEBRTC/node_modules
