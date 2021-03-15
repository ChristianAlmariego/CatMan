#!/usr/bin/bash
exec bash --login -c "node $(for i in "$@" ; do printf '\"%s\" ' "$i" ; done ;)"
