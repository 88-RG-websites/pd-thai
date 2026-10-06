// Resolves each page's <title>/meta description from client.js. Frontmatter
// can't interpolate {{ client.* }} (Eleventy doesn't render frontmatter
// strings), so pages either set a literal `title:`/`description:` in
// frontmatter or get the entry from client.seo keyed by their file slug
// (index.njk → "index", menus.njk → "menus").
module.exports = {
  title: (data) => {
    if (data.title) return data.title;
    const seo = data.client.seo[data.page.fileSlug || 'index'];
    return seo ? seo.title : data.client.name;
  },
  description: (data) => {
    if (data.description) return data.description;
    const seo = data.client.seo[data.page.fileSlug || 'index'];
    return seo ? seo.description : '';
  },
};
