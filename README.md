## Websketches


#### Useful commands

```
ffmpeg -y -framerate 30 -i [folder]/%07d.png -c:v libx264 -pix_fmt yuv420p sketch.mp4

ffmpeg -i video.mp4 -vf scale=256:256 video-thumb.mp4
```
