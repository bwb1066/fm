export default function decorate(block) {
  const picture = block.querySelector('picture');
  if (picture) {
    const pictureWrapper = picture.closest('p') || picture;
    block.prepend(pictureWrapper);
  }
}
