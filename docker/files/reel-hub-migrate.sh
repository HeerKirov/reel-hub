#!/bin/sh
set -e
cd /opt/prisma-migrate || exit 1
exec ./node_modules/.bin/prisma "$@"
