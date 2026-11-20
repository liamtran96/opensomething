# Media of the home page

Put the images and videos of the home page in this folder. Then give the file
name to the `Media` component in `app/(home)/page.tsx`:

```tsx
<Media label="Video: the application in use" file="hero.mp4" />
```

- A file that ends in `.mp4` or `.webm` plays as a silent video in a loop.
- Any other file shows as an image.
- Without `file`, a placeholder box shows.

For a feature box, add `file: "name.png"` to its entry in the `features`
list, and give it to the component: `<Media label={feature.media} file={feature.file} />`.
