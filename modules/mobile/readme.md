## Run on device

```shell
npx expo start --clear

npx expo run:ios --device
```

## Build production binary

```shell
eas build --platform ios
```

## Submit to App Store

[Documentation](https://docs.expo.dev/deploy/submit-to-app-stores/)

```shell
eas submit -p ios
```