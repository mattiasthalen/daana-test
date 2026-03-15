#!/bin/bash

# Log into GitHub and configure git
gh auth login -p ssh
git config --global user.name "$(gh api user -q .name)"
git config --global user.email "$(gh api user -q .email)"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
echo "$(git config --global user.email) $(cat ~/.ssh/id_ed25519.pub)" > ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers

# Install daana-cli
tar -xzf daana-cli_0.5.17_linux_amd64.tar.gz
sudo mv daana-cli /usr/local/bin/
daana-cli --version