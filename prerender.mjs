import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const routes = [
  '/',
  '/access-notes',
  '/subjects/mu/sem3',
  '/subjects/mu/sem4',
  '/subjects/msbte/sem4',
  '/subjects/msbte/sem5',
  '/subjects/msbte/sem6',
]

const template = fs.readFileSync(path.resolve(__dirname, 'dist/index.html'), 'utf-8')

for (const route of routes) {
  const dir = path.resolve(__dirname, 'dist' + route)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), template)
  console.log('prerendered:', route)
}