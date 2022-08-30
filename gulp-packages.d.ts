declare module 'gulp-layout' {
  const task: (...opts: unknown[]) => NodeJS.ReadWriteStream;
  export default task;
}

declare module 'gulp-refresh' {
  interface Refresh {
    (...opts: unknown[]): NodeJS.ReadWriteStream;
    listen: () => void;
  }
  const task: Refresh;
  export default task;
}

declare module 'gulp-markdown' {
  const task: (...opts: unknown[]) => NodeJS.ReadWriteStream;
  export default task;
}

declare module 'gulp-prompt' {
  interface Prompt {
    confirm<T = boolean>(opts: {
      message?: string;
      default?: T;
    }): NodeJS.ReadWriteStream;
  }
  const task: Prompt;
  export default task;
}

declare module 'gulp-rsync' {
  const task: (...opts: unknown[]) => NodeJS.ReadWriteStream;
  export default task;
}
