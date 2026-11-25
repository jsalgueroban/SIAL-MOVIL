import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ActionCard,
  BanasanMobileProvider,
  Button,
  CameraIcon,
  ChevronRightIcon,
  Chip,
  CloseIcon,
  Field,
  IconButton,
  Modal,
  Notice,
  PlusIcon,
  PickerTrigger,
  Surface,
  Text,
  TextInput,
  ToastProvider,
  useBanasanTheme,
  useToast,
} from '@banasandev/banasan-ui-mobile';
import { ContainerSelector } from './ContainerSelector';
import containerFixtures from './container-fixtures.json';

type Photo = { dataUrl: string };
type Draft = {
  seal: string;
  requiredPhoto: Photo | null;
  additionalPhotos: Photo[];
  closed: boolean;
  savedAt: string | null;
};
declare global {
  interface Window {
    SialMobileUI: {
      openPhotoCapture: (config: {
        title: string;
        eventName: string;
        pointKey: string;
        allowMultiple: boolean;
        maxPhotos: number;
        onComplete: (photos: Photo[]) => void;
      }) => void;
      openBarcodeScanner: (config: {
        title: string;
        initialManualValue: string;
        manualLabel: string;
        normalize: (value: string) => string;
        validate: (value: string) => boolean | string;
        onDetected: (value: string) => void;
      }) => void;
    };
  }
}
const storageKey = 'sial-proposal-mario-puerto-v1';
const selectionKey = 'sial-proposal-mario-puerto-container';
const containerOptions = [
  {
    value: 'SIALC9081726',
    label: 'SIALC9081726',
    description: 'Contenedor final · ejemplo de la propuesta',
    operation: 'EXP-2026-0418',
    journey: 'VIAJE-7751',
    vehicle: 'TUL458',
    location: 'En ZE',
  },
  ...containerFixtures,
];
const draftKey = (container: string) =>
  container === containerOptions[0].value
    ? storageKey
    : storageKey + ':' + container;
function selectedContainer() {
  try {
    const value = localStorage.getItem(selectionKey);
    return containerOptions.some((option) => option.value === value)
      ? value!
      : containerOptions[0].value;
  } catch {
    return containerOptions[0].value;
  }
}
const emptyDraft = (): Draft => ({
  seal: '',
  requiredPhoto: null,
  additionalPhotos: [],
  closed: false,
  savedAt: null,
});
const validPhoto = (value: unknown): value is Photo =>
  Boolean(
    value &&
    typeof value === 'object' &&
    'dataUrl' in value &&
    typeof value.dataUrl === 'string' &&
    /^data:image\/(jpeg|png|webp);base64,/i.test(value.dataUrl),
  );
function restore(container: string): { draft: Draft; error: string } {
  try {
    const value = JSON.parse(
      localStorage.getItem(draftKey(container)) || 'null',
    );
    if (!value || typeof value.seal !== 'string')
      return { draft: emptyDraft(), error: '' };
    const seal = value.seal.slice(0, 80),
      requiredPhoto = validPhoto(value.requiredPhoto)
        ? value.requiredPhoto
        : null;
    return {
      draft: {
        seal,
        requiredPhoto,
        additionalPhotos: Array.isArray(value.additionalPhotos)
          ? value.additionalPhotos.filter(validPhoto).slice(0, 3)
          : [],
        closed:
          value.closed === true &&
          seal.trim().length >= 4 &&
          Boolean(requiredPhoto),
        savedAt:
          typeof value.savedAt === 'string' && !isNaN(Date.parse(value.savedAt))
            ? value.savedAt
            : null,
      },
      error: '',
    };
  } catch {
    return {
      draft: emptyDraft(),
      error:
        'No se pudo recuperar el borrador local. Revisa la información antes de guardar.',
    };
  }
}
function AnchorIcon() {
  const { colors } = useBanasanTheme();
  return (
    <Surface
      padding="none"
      radius="control"
      style={[styles.iconPlate, { backgroundColor: colors.primary.light }]}
    >
      <Svg
        width={24}
        height={24}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.primary.main}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        accessible={false}
      >
        <Circle cx={12} cy={4} r={2} />
        <Path d="M12 6v15M8 10h8M4 14v2a8 5 0 0 0 16 0v-2M2 16l2-2 2 2m12 0 2-2 2 2" />
      </Svg>
    </Surface>
  );
}
function ScanIcon() {
  const { colors } = useBanasanTheme();
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.primary.main}
      strokeWidth={2}
      strokeLinecap="round"
      accessible={false}
    >
      <Path d="M8 3H4v4m12-4h4v4M4 17v4h4m12-4v4h-4M6 12h12" />
    </Svg>
  );
}
function MarioPuerto() {
  const theme = useBanasanTheme(),
    { showToast } = useToast();
  const [container, setContainer] = useState(selectedContainer);
  const [pendingContainer, setPendingContainer] = useState<string | null>(null);
  const [containerSelectorOpen, setContainerSelectorOpen] = useState(false);
  const [initial] = useState(() => restore(container)),
    [draft, setDraft] = useState(initial.draft),
    [error, setError] = useState(initial.error);
  const [dirty, setDirty] = useState(false),
    [touched, setTouched] = useState(false);
  const [dialog, setDialog] = useState<'close' | 'reset' | 'container' | null>(
    null,
  );
  const hasSeal = draft.seal.trim().length >= 4,
    ready = hasSeal && Boolean(draft.requiredPhoto);
  const requirement =
    !hasSeal && !draft.requiredPhoto
      ? 'Faltan el precinto y su fotografía para cerrar.'
      : !hasSeal
        ? 'Falta un precinto de al menos 4 caracteres.'
        : !draft.requiredPhoto
          ? 'Falta la fotografía del precinto para cerrar.'
          : 'Precinto y fotografía listos para el cierre.';
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function edit(change: Partial<Draft>) {
    if (draft.closed) return;
    setDraft((current) => ({ ...current, ...change }));
    setDirty(true);
    setError('');
  }
  function persist(closed = draft.closed) {
    const next = { ...draft, closed, savedAt: new Date().toISOString() };
    try {
      localStorage.setItem(draftKey(container), JSON.stringify(next));
    } catch {
      setError(
        'No se pudo guardar en este dispositivo. El almacenamiento puede estar lleno o no disponible. Conserva la vista abierta e inténtalo de nuevo.',
      );
      return false;
    }
    setDraft(next);
    setDirty(false);
    setError('');
    showToast({
      tone: 'success',
      title: closed ? 'Cargue cerrado' : 'Cargue guardado',
      message: closed
        ? 'Edición bloqueada en esta demostración.'
        : 'Borrador guardado en este dispositivo. Puedes continuar después.',
      duration: 3200,
    });
    return true;
  }
  function capture(required: boolean) {
    if (
      draft.closed ||
      (!required &&
        (!draft.requiredPhoto || draft.additionalPhotos.length >= 3))
    )
      return;
    window.SialMobileUI.openPhotoCapture({
      title: required
        ? 'Precinto final instalado'
        : 'Evidencias adicionales del cierre',
      eventName: 'mario-puerto-proposal',
      pointKey: required ? 'precinto-final' : 'adicionales',
      allowMultiple: !required,
      maxPhotos: required ? 1 : 3 - draft.additionalPhotos.length,
      onComplete: (photos) => {
        const usable = (photos || [])
          .filter(validPhoto)
          .map((photo) => ({ dataUrl: photo.dataUrl }));
        if (!usable.length) return;
        edit(
          required
            ? { requiredPhoto: usable[0] }
            : {
                additionalPhotos: [...draft.additionalPhotos, ...usable].slice(
                  0,
                  3,
                ),
              },
        );
      },
    });
  }
  function scan() {
    window.SialMobileUI.openBarcodeScanner({
      title: 'Escanear precinto',
      initialManualValue: draft.seal,
      manualLabel: 'Usar precinto',
      normalize: (value) =>
        String(value || '')
          .trim()
          .toUpperCase(),
      validate: (value) =>
        value.length >= 4 && value.length <= 80
          ? true
          : 'Ingresa entre 4 y 80 caracteres para el precinto.',
      onDetected: (value) => {
        edit({ seal: value });
        setTouched(false);
      },
    });
  }
  function confirm() {
    if (dialog === 'container' && pendingContainer) {
      if (persist(false)) changeContainer(pendingContainer);
      else setDialog(null);
    }
    if (dialog === 'close' && ready) {
      if (persist(true)) setDialog(null);
    }
    if (dialog === 'reset') {
      try {
        localStorage.removeItem(draftKey(container));
      } catch {
        setError(
          'No se pudo eliminar el guardado local. Inténtalo nuevamente.',
        );
        setDialog(null);
        return;
      }
      setDraft(emptyDraft());
      setDirty(false);
      setTouched(false);
      setError('');
      setDialog(null);
    }
  }
  function changeContainer(value: string) {
    if (!containerOptions.some((option) => option.value === value)) return;
    const restored = restore(value);
    setContainer(value);
    setDraft(restored.draft);
    setError(restored.error);
    setDirty(false);
    setTouched(false);
    setPendingContainer(null);
    setDialog(null);
    try {
      localStorage.setItem(selectionKey, value);
    } catch {
      setError(
        'El contenedor se cambió, pero no se pudo recordar la selección en este dispositivo.',
      );
    }
  }
  function requestContainer(value: string) {
    if (value === container) return;
    if (dirty) {
      setPendingContainer(value);
      setDialog('container');
    } else changeContainer(value);
  }
  const saved = draft.closed
    ? 'Cierre guardado solo en este dispositivo'
    : dirty
      ? 'Cambios sin guardar'
      : draft.savedAt
        ? 'Guardado en este dispositivo · ' +
          new Date(draft.savedAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Sin guardar';
  const cameraIcon = (
    <Surface
      padding="none"
      radius="control"
      style={[
        styles.iconPlate,
        { backgroundColor: theme.colors.primary.light },
      ]}
    >
      <View style={{ width: 20, height: 20 }}>
        <CameraIcon size={20} color={theme.colors.primary.main} />
      </View>
    </Surface>
  );
  return (
    <View style={styles.stack} testID="mario-native-screen">
      <Surface
        fullWidth
        bordered
        elevated
        padding="lg"
        radius="large"
        testID="mp-container-card"
      >
        <PickerTrigger
          label="Contenedor"
          accessibilityLabel="Seleccionar contenedor"
          required
          valueLabel={container}
          onPress={() => setContainerSelectorOpen(true)}
          helperText="Selecciona el contenedor para revisar su seguridad y cierre."
        />
        <ContainerSelector
          visible={containerSelectorOpen}
          value={container}
          options={[...containerOptions.slice(1), containerOptions[0]]}
          onClose={() => setContainerSelectorOpen(false)}
          onSelect={(value) => {
            setContainerSelectorOpen(false);
            requestContainer(value);
          }}
        />
      </Surface>
      <Surface
        fullWidth
        bordered
        elevated
        padding="lg"
        radius="large"
        style={styles.capture}
        testID="mp-capture-card"
      >
        <View style={styles.heading}>
          <AnchorIcon />
          <Text
            variant="titleSm"
            weight="bold"
            accessibilityRole="header"
            aria-level={2}
            style={styles.headingText}
          >
            Seguridad y cierre
          </Text>
          <Chip
            variant="soft"
            appearance="label"
            tone={draft.closed ? 'success' : 'warning'}
            accessibilityLabel={
              'Estado: ' + (draft.closed ? 'Cerrado' : 'Editable')
            }
          >
            {draft.closed ? 'Cerrado' : 'Editable'}
          </Chip>
        </View>
        <Text variant="helper" color="secondary">
          Identifica el precinto y registra su evidencia antes de cerrar el
          cargue.
        </Text>
        <Field
          label="Precinto final"
          required
          helperText="Escribe o escanea el número del precinto instalado."
          errorText={
            touched && draft.seal.length > 0 && !hasSeal
              ? 'El precinto debe tener al menos 4 caracteres.'
              : undefined
          }
        >
          <View style={styles.row}>
            <View style={styles.flex}>
              <TextInput
                accessibilityLabel="Precinto final"
                nativeID="mp-seal"
                testID="mp-seal"
                value={draft.seal}
                editable={!draft.closed}
                placeholder="Número de precinto"
                maxLength={80}
                autoCapitalize="characters"
                autoComplete="off"
                onChangeText={(value) => edit({ seal: value.toUpperCase() })}
                onBlur={() => setTouched(true)}
              />
            </View>
            <IconButton
              icon={<ScanIcon />}
              accessibilityLabel="Escanear precinto"
              disabled={draft.closed}
              onPress={scan}
            />
          </View>
        </Field>
        <View style={styles.photoSection}>
          <View style={styles.between}>
            <Text variant="label" weight="semibold">
              Evidencia del precinto
            </Text>
            <Text variant="helper" color="secondary">
              {draft.requiredPhoto ? '1/1' : '0/1'}
            </Text>
          </View>
          {draft.requiredPhoto && (
            <View testID="mp-required-preview" style={styles.preview}>
              <Image
                source={{ uri: draft.requiredPhoto.dataUrl }}
                accessibilityLabel="Evidencia del precinto final"
                style={styles.previewImage}
              />
              <Text
                variant="helper"
                color="success"
                style={styles.previewCaption}
              >
                Fotografía obligatoria registrada
              </Text>
            </View>
          )}
          <ActionCard
            fullWidth
            style={{
              borderStyle: 'dashed',
              borderColor: theme.colors.primary.main,
              backgroundColor: theme.colors.primary[50],
            }}
            title={
              draft.requiredPhoto
                ? 'Volver a tomar la fotografía'
                : 'Fotografiar precinto'
            }
            description={
              draft.requiredPhoto
                ? 'La nueva captura reemplazará la actual'
                : 'Obligatoria · el número debe verse con claridad'
            }
            icon={cameraIcon}
            trailing={<ChevronRightIcon size={18} />}
            onPress={() => capture(true)}
            disabled={draft.closed}
            testID="mp-photo"
          />
          {draft.requiredPhoto && (
            <View style={styles.photoSection} testID="mp-additional">
              <View style={styles.between}>
                <Text variant="label" weight="semibold" style={styles.flex}>
                  Evidencias adicionales{' '}
                  <Text variant="helper" color="secondary">
                    (opcional)
                  </Text>
                </Text>
                <Text variant="helper" color="secondary">
                  {draft.additionalPhotos.length}/3
                </Text>
              </View>
              <View style={styles.gallery} testID="mp-extra-gallery">
                {draft.additionalPhotos.map((photo, index) => (
                  <View key={index} style={styles.galleryItem}>
                    <Image
                      source={{ uri: photo.dataUrl }}
                      accessibilityLabel={'Evidencia adicional ' + (index + 1)}
                      style={styles.thumb}
                    />
                    {!draft.closed && (
                      <View style={styles.remove}>
                        <IconButton
                          size="sm"
                          variant="filled"
                          intent="neutral"
                          icon={<CloseIcon size={16} />}
                          accessibilityLabel={
                            'Eliminar evidencia adicional ' + (index + 1)
                          }
                          onPress={() =>
                            edit({
                              additionalPhotos: draft.additionalPhotos.filter(
                                (_, item) => item !== index,
                              ),
                            })
                          }
                        />
                      </View>
                    )}
                    <Text variant="caption" color="secondary">
                      Adicional {index + 1}
                    </Text>
                  </View>
                ))}
              </View>
              {!draft.closed && draft.additionalPhotos.length < 3 && (
                <Button
                  fullWidth
                  variant="outlined"
                  leftIcon={<PlusIcon size={18} />}
                  onPress={() => capture(false)}
                >
                  Agregar fotografía
                </Button>
              )}
              <Text variant="helper" color="tertiary">
                {draft.additionalPhotos.length === 3
                  ? 'Registraste las 3 fotografías adicionales.'
                  : 'Puedes agregar hasta ' +
                    (3 - draft.additionalPhotos.length) +
                    ' fotografías adicionales.'}
              </Text>
            </View>
          )}
        </View>
      </Surface>
      <Surface
        fullWidth
        bordered
        elevated
        padding="lg"
        radius="large"
        style={styles.confirmation}
        testID="mp-confirmation-card"
      >
        <View style={styles.statusRow} accessibilityLiveRegion="polite">
          <View
            style={[
              styles.dot,
              {
                backgroundColor: ready
                  ? theme.colors.success.main
                  : theme.colors.warning.main,
              },
            ]}
          />
          <Text
            variant="helper"
            color={ready ? 'success' : 'secondary'}
            style={styles.flex}
          >
            {draft.closed
              ? 'Cierre registrado en esta demostración.'
              : requirement}
          </Text>
        </View>
        {error.length > 0 && (
          <Text variant="helper" color="danger" accessibilityRole="alert">
            {error}
          </Text>
        )}
        <Text
          variant="helper"
          color="tertiary"
          accessibilityLiveRegion="polite"
        >
          {saved}
        </Text>
        {!draft.closed && (
          <Button
            fullWidth
            variant="outlined"
            onPress={() => persist(false)}
            testID="mp-save"
          >
            Guardar cargue
          </Button>
        )}
        <Button
          fullWidth
          disabled={!ready || draft.closed}
          onPress={() => setDialog('close')}
          testID="mp-close"
        >
          {draft.closed ? 'Cargue cerrado' : 'Cerrar cargue del contenedor'}
        </Button>
        <Text variant="helper" color="tertiary" align="center">
          Guardar permite continuar después. Cerrar bloquea la edición.
        </Text>
      </Surface>
      {draft.closed && (
        <Notice variant="success">
          <View testID="mp-closed">
            <Text variant="label" weight="semibold">
              Cargue cerrado en la demostración
            </Text>
            <Text variant="helper">
              Precinto {draft.seal} · edición bloqueada.
            </Text>
            <Text variant="helper" color="secondary">
              Este prototipo no envía datos al servidor.
            </Text>
          </View>
        </Notice>
      )}
      <Button
        variant="ghost"
        intent="neutral"
        onPress={() => setDialog('reset')}
      >
        Reiniciar demostración
      </Button>
      <Modal
        visible={dialog !== null}
        title={
          dialog === 'container'
            ? '¿Cambiar de contenedor?'
            : dialog === 'reset'
              ? '¿Reiniciar la demostración?'
              : '¿Cerrar el cargue?'
        }
        description={
          dialog === 'container'
            ? 'Hay cambios sin guardar en ' +
              container +
              '. Guarda su borrador antes de cambiar a ' +
              pendingContainer +
              '.'
            : dialog === 'reset'
              ? 'Se eliminarán el precinto, las fotografías y el guardado local de Mario puerto.'
              : 'Precinto ' +
                draft.seal +
                '. Una fotografía obligatoria y ' +
                draft.additionalPhotos.length +
                ' adicionales. Al confirmar se bloqueará la edición en esta demostración.'
        }
        onRequestClose={() => setDialog(null)}
        footer={
          <View style={styles.dialogActions}>
            <Button
              fullWidth
              variant="outlined"
              intent="neutral"
              onPress={() => setDialog(null)}
            >
              {dialog === 'container'
                ? 'Seguir editando'
                : dialog === 'reset'
                  ? 'Conservar'
                  : 'Seguir revisando'}
            </Button>
            <Button
              fullWidth
              intent={dialog === 'reset' ? 'danger' : 'primary'}
              onPress={confirm}
            >
              {dialog === 'container'
                ? 'Guardar y cambiar'
                : dialog === 'reset'
                  ? 'Reiniciar'
                  : 'Confirmar cierre'}
            </Button>
          </View>
        }
      />
    </View>
  );
}
function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setMode(
        document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
      ),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);
  return (
    <BanasanMobileProvider
      mode={mode}
      theme={{
        typography: {
          fontFamily: 'Poppins',
          roles: { label: { fontWeight: '600' } },
        },
      }}
    >
      <ToastProvider placement="bottom" offset={24} style={{ maxWidth: 456 }}>
        {createPortal(
          <MarioPuerto />,
          document.getElementById('mario-native-root')!,
        )}
      </ToastProvider>
    </BanasanMobileProvider>
  );
}
const styles = StyleSheet.create({
  stack: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, minWidth: 0 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingText: { flex: 1, minWidth: 0 },
  iconPlate: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  capture: { gap: 22 },
  photoSection: { gap: 10 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  confirmation: { gap: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  preview: { borderRadius: 8, overflow: 'hidden' },
  previewImage: { width: '100%', height: 155 },
  previewCaption: { padding: 10 },
  gallery: { flexDirection: 'row', gap: 8 },
  galleryItem: { flex: 1, maxWidth: '33.33%', gap: 4 },
  thumb: { width: '100%', height: 84, borderRadius: 8 },
  remove: { position: 'absolute', right: 0, top: 0 },
  dialogActions: { gap: 10 },
});
createRoot(document.getElementById('mario-runtime-root')!).render(<App />);
