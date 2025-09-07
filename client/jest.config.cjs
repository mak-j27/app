module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.[tj]sx?$': 'esbuild-jest'
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  setupFiles: ['<rootDir>/test/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/test/styleMock.js',
    '\\.(png|jpg|jpeg|svg|gif)$': '<rootDir>/test/styleMock.js'
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/test/'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node']
};
