# npm-git

* 用private git(gitLab,bitbucket,etc)代替私有npm
* 用`npmgit publish`代替`npm publish`命令行，直接compile & push到git仓库

## Why?

想实现私有的npm，通常是2种方案：

1. npmjs.com即将推出的：[npm private modules](https://www.npmjs.com/private-npm) & [npm Enterprise](https://www.npmjs.com/enterprise)

	* [npm private modules](https://www.npmjs.com/private-npm) 可指定有权使用package的用户，也就是你可以`npm publish @mycorp/mypkg`，而mypkg源码可以放在任何git仓库。
	* [npm Enterprise](https://www.npmjs.com/enterprise) 结合GitHub企业版，更完美了。

2. [自建npm服务器](http://cnpmjs.org)，维护比较复杂，不推荐。

而以上2种方案，都还是需要自行管理源码：git仓库，即开发者至少需要2步才能完成1个package的发布：

1. `git commit && git push`
2. `npm publish`

__除此之外，就是用npm本身对[Git URLs](https://docs.npmjs.com/files/package.json)的支持了（[《关于commit-ish》](https://github.com/cutsin/Passion-of-the-Cutsin/blob/master/2014/11/commit-ish%E4%B8%AD%E7%9A%84ish%E6%98%AF%E4%BB%80%E4%B9%88%E6%84%8F%E6%80%9D%EF%BC%9F.md)）：__
```json
dependencies: {
  "mypkg": "git+https://mycopr/mypkg.git#commit-ish"
}
```
这样成本较低，但看不了依赖、被依赖、安装量等等

## Usage

package.json：
```json
{
  "version": "0.1.8"
}
```
```bash
npmgit publish 'bug fix'
// -> git+git@mycorp:/mypkg.git#0.1.8 is published.
```
如果git tag等于package version，自增1为：0.1.9
```bash
npmgit publish
// -> git+git@mycorp:/mypkg.git#0.1.9 is published.
```

## Todo

## License

[MIT](LICENSE)