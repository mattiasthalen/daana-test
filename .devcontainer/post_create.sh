#!/bin/bash
# macOS/Linux: Extract and move to PATH
tar -xzf daana-cli_0.5.17_linux_amd64.tar.gz
sudo mv daana-cli /usr/local/bin/
 
# Verify installation
daana-cli --version