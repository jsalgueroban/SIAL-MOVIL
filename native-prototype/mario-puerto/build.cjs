const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

async function build() {
  const dependencyRoot = path.resolve(process.argv[2] || '');
  if (
    !process.argv[2] ||
    !fs.existsSync(path.join(dependencyRoot, 'package.json'))
  ) {
    throw new Error(
      'Indica la raíz del consumidor móvil con sus dependencias instaladas.',
    );
  }
  const request = createRequire(path.join(dependencyRoot, 'package.json'));
  const esbuild = request('esbuild');
  const libraryManifestPath = request.resolve(
    '@banasandev/banasan-ui-mobile/package.json',
  );
  const libraryRoot = path.dirname(libraryManifestPath);
  const manifest = JSON.parse(fs.readFileSync(libraryManifestPath, 'utf8'));
  const proposalRoot = path.resolve(__dirname, '../..');
  const destination = path.join(proposalRoot, 'assets/mario-puerto');
  fs.mkdirSync(destination, { recursive: true });
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, 'mario-puerto.web.tsx')],
    outfile: path.join(destination, 'mario-puerto.js'),
    bundle: true,
    minify: true,
    platform: 'browser',
    format: 'iife',
    mainFields: ['browser', 'module', 'main'],
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.json',
    ],
    nodePaths: [path.join(dependencyRoot, 'node_modules')],
    alias: {
      '@banasandev/banasan-ui-mobile': path.join(libraryRoot, manifest.module),
      'react-native': request.resolve('react-native-web'),
      react: path.dirname(request.resolve('react/package.json')),
      'react-dom': path.dirname(request.resolve('react-dom/package.json')),
      'react-native-svg': path.dirname(
        request.resolve('react-native-svg/package.json'),
      ),
    },
    define: {
      'process.env.NODE_ENV': '"production"',
      __DEV__: 'false',
      global: 'globalThis',
    },
    metafile: true,
  });
  const normalize = (value) => value.replaceAll('\\', '/');
  const actualInputs = Object.keys(result.metafile.inputs).filter((input) =>
    normalize(path.resolve(input)).startsWith(normalize(libraryRoot) + '/'),
  );
  const components = [
    'Chip',
    'Toast',
    'ToastProvider',
    'Button',
    'TextInput',
    'Text',
    'Surface',
    'ActionCard',
    'IconButton',
    'Field',
    'Modal',
    'PickerTrigger',
  ];
  const evidence = components.map((component) => {
    const filename = actualInputs.find((input) =>
      normalize(input).endsWith('/' + component + '.js'),
    );
    if (!filename)
      throw new Error('El bundle no contiene el componente real ' + component);
    return {
      component,
      source: normalize(path.relative(libraryRoot, filename)),
      sha256: crypto
        .createHash('sha256')
        .update(fs.readFileSync(filename))
        .digest('hex'),
    };
  });
  const bundle = fs.readFileSync(path.join(destination, 'mario-puerto.js'));
  fs.writeFileSync(
    path.join(destination, 'library-provenance.json'),
    JSON.stringify(
      {
        package: manifest.name,
        version: manifest.version,
        runtime: 'React Native Web',
        components: evidence,
        bundleSha256: crypto.createHash('sha256').update(bundle).digest('hex'),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({
      package: manifest.name,
      version: manifest.version,
      components: evidence.map((item) => item.component),
      bytes: bundle.length,
    }),
  );
}
build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
