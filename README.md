## Websketches

#### Useful commands

```
ffmpeg -y -framerate 60 -i [folder]/%07d.png -c:v libx264 -pix_fmt yuv420p video.mp4

ffmpeg -i video.mp4 -vf "scale=(iw*sar)*max(256/(iw*sar)\,256/ih):ih*max(256/(iw*sar)\,256/ih), crop=256:256" video-thumb.mp4
```
