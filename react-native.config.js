module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath: 'import com.linkzly.reactnative.LinkzlyReactNativePackage;',
        packageInstance: 'new LinkzlyReactNativePackage()',
      },
    },
  },
};

