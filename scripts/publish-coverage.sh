curl https://keybase.io/codecovsecurity/pgp_keys.asc | gpg --import # One time step

curl -Os https://uploader.codecov.io/latest/codecov-linux

curl -Os https://uploader.codecov.io/latest/codecov-linux.SHA256SUM

curl -Os https://uploader.codecov.io/latest/codecov-linux.SHA256SUM.sig

gpg --verify codecov-linux.SHA256SUM.sig codecov-linux.SHA256SUM

shasum -a 256 -c codecov-linux.SHA256SUM

chmod +x codecov-linux
./codecov-linux -t $1