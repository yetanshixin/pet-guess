# PetGuess

# 🎮 洛克王国精灵猜猜看 (Rocomle)

这是一个由个人独立开发的《洛克王国》精灵竞猜小游戏！本项目基于 **Angular** 框架进行纯前端开发，无需后端服务器即可流畅运行。

玩家需要通过输入精灵的名称来进行猜测。每次猜测后，系统会给出属性、阶段、种族值等维度的颜色与箭头提示，帮助你一步步锁定最终的目标精灵。

---

## 🌟 致谢与参考 (Credits & Acknowledgements)

本项目的诞生离不开以下优秀的开源项目与社区贡献，在此表示最诚挚的感谢：

*   **💡 灵感来源：** 核心玩法灵感源自经典的猜宝可梦网站：[http://1.14.255.210:888/#/](http://1.14.255.210:888/#/)，感谢其带来的奇妙游戏体验。
*   **💻 源码参考：** 以及在开发过程中，参考了猜宝可梦网站的开源项目 [QuantAskk/pokemonle](https://github.com/QuantAskk/pokemonle/tree/main) 的部分代码结构与逻辑实现。非常感谢原作者的开源精神与分享！
*   **📊 数据来源：** 游戏内的所有精灵基础数据、形态信息及进化链均取自 [洛克王国 BWIKI](https://wiki.biligame.com/rocom/)。特别感谢 BWIKI 所有辛勤编辑和维护图鉴数据的贡献者们。


This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
