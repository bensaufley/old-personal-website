export interface Config {
  defaultLayout: string;
  devServerPort: number;
  distDirectory: string;
}

const config: Config = {
  defaultLayout: 'app',
  devServerPort: 9270,
  distDirectory: 'dist',
};

export default config;
