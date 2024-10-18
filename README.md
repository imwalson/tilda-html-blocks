# tilda-html-blocks

Add html-code blocks on Tilda.

# About

Check the url [https://tilda.cc/](https://tilda.cc/) . With Tilda, you can create beautiful websites without any code.

# How Tilda Works

See the [getting started](https://help.tilda.cc/getstarted)

# How to Embed HTML Code on tilda

See the document here: https://help.tilda.cc/html#!/tab/51493721-1

# debugging locally

Install `http-server`

```bash
npm install -g http-server
```

Run code locally:

```bash
http-server
```

# free CDNs for open source projects

- [jsdelivr](https://www.jsdelivr.com/)
- [unpkg](https://www.unpkg.com/)

# jsdelivr mirrors

- cdn.jsdmirror.cn
- jsd.onmicrosoft.cn
- cdn.jsdmirror.com

## How to add js file using jsdelivr

Full documentation: https://www.jsdelivr.com/documentation

### For github

```javascript
// load any GitHub release, commit, or branch

// note: we recommend using npm for projects that support it

https://cdn.jsdelivr.net/gh/user/repo@version/file


// load jQuery v3.6.4

https://cdn.jsdelivr.net/gh/jquery/jquery@3.6.4/dist/jquery.min.js


// use a version range instead of a specific version

https://cdn.jsdelivr.net/gh/jquery/jquery@3.6/dist/jquery.min.js

https://cdn.jsdelivr.net/gh/jquery/jquery@3/dist/jquery.min.js


// omit the version completely to get the latest one

// you should NOT use this in production

https://cdn.jsdelivr.net/gh/jquery/jquery/dist/jquery.min.js


// add ".min" to any JS/CSS file to get a minified version

// if one doesn't exist, we'll generate it for you

https://cdn.jsdelivr.net/gh/jquery/jquery@3.6.4/src/core.min.js


// add / at the end to get a directory listing

https://cdn.jsdelivr.net/gh/jquery/jquery/
```

### For npm

```javascript
// load any project hosted on npm

https://cdn.jsdelivr.net/npm/package@version/file


// load jQuery v3.6.4

https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js


// use a version range instead of a specific version

https://cdn.jsdelivr.net/npm/jquery@3.6/dist/jquery.min.js

https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js


// omit the version completely to get the latest one

// you should NOT use this in production

https://cdn.jsdelivr.net/npm/jquery/dist/jquery.min.js


// add ".min" to any JS/CSS file to get a minified version

// if one doesn't exist, we'll generate it for you

https://cdn.jsdelivr.net/npm/jquery@3.6.4/src/core.min.js


// omit the file path to get the default file

https://cdn.jsdelivr.net/npm/jquery@3.6


// add / at the end to get a directory listing

https://cdn.jsdelivr.net/npm/jquery/
```
