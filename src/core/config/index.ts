import ConfigEntity from './ConfigEntity'
import YAML from 'yaml'
import fs from 'fs'
import path from 'path'
import alg from 'libs/alg'


const pkgJsonPath = path.resolve(__dirname, '../../../package.json')
const defaultConfigPath = path.resolve(__dirname, '../../../config/default.yaml')
const configPath = process.argv.find(arg => arg.startsWith('--config='))?.replace('--config=', '')

const defaultConfig = YAML.parse(fs.readFileSync(defaultConfigPath, {encoding: 'utf-8'}))
const config: ConfigEntity = alg.object.assignDefaultPropertiesDeep(
  configPath
    ? YAML.parse(fs.readFileSync(configPath, {encoding: 'utf-8'}))
    : {},
  defaultConfig
)
config.pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, {encoding: 'utf-8'}))


export default new ConfigEntity(config)