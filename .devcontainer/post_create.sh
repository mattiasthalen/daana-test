#!/bin/bash

# Log into GitHub and configure git
gh auth login -p ssh -s admin:ssh_signing_key --skip-ssh-key
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 <<< y > /dev/null
gh ssh-key add ~/.ssh/id_ed25519.pub --type authentication --title "$(basename "$PWD")"
git config --global user.name "$(gh api user -q .name)"
git config --global user.email "$(gh api user -q .email)"
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub
git config --global commit.gpgsign true
git config --global tag.gpgsign true
echo "$(git config --global user.email) $(cat ~/.ssh/id_ed25519.pub)" > ~/.ssh/allowed_signers
git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
gh ssh-key add ~/.ssh/id_ed25519.pub --type signing --title "$(basename "$PWD") (signing)"

# Install daana-cli
tar -xzf daana-cli_0.5.17_linux_amd64.tar.gz
sudo mv daana-cli /usr/local/bin/
daana-cli --version