import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Modal,
  Surface,
  Text,
  TextInput,
  useBanasanTheme,
} from '@banasandev/banasan-ui-mobile';

export type ContainerOption = {
  value: string;
  label: string;
  operation: string;
  journey: string;
  vehicle: string;
  location: string;
};
type Props = {
  visible: boolean;
  value: string;
  options: ContainerOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
};
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function ContainerSelector({
  visible,
  value,
  options,
  onSelect,
  onClose,
}: Props) {
  const theme = useBanasanTheme();
  const [query, setQuery] = useState(''),
    [page, setPage] = useState(0);
  useEffect(() => {
    if (visible) {
      setQuery('');
      setPage(0);
    }
  }, [visible]);
  const filtered = options.filter((option) =>
    normalize(
      [option.label, option.operation, option.journey, option.vehicle].join(
        ' ',
      ),
    ).includes(normalize(query)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 4)),
    current = Math.min(page, pages - 1);
  return (
    <Modal
      visible={visible}
      title="Selecciona un contenedor"
      description="Elige un contenedor para revisar su cargue en puerto."
      onRequestClose={onClose}
      footer={
        <View style={styles.pagination}>
          <View style={styles.pageButton}>
            <Button
              fullWidth
              size="sm"
              variant="outlined"
              intent="neutral"
              disabled={current === 0}
              onPress={() => setPage(current - 1)}
            >
              Anterior
            </Button>
          </View>
          <Text
            variant="caption"
            weight="semibold"
            color="secondary"
            align="center"
            style={styles.pageStatus}
            accessibilityLiveRegion="polite"
          >
            Página {current + 1} de {pages} · {filtered.length} contenedores
          </Text>
          <View style={styles.pageButton}>
            <Button
              fullWidth
              size="sm"
              variant="outlined"
              intent="neutral"
              disabled={current === pages - 1}
              onPress={() => setPage(current + 1)}
            >
              Siguiente
            </Button>
          </View>
        </View>
      }
    >
      <View style={styles.content}>
        <Text variant="helper" color="secondary">
          Busca por contenedor, viaje o placa.
        </Text>
        <TextInput
          accessibilityLabel="Buscar contenedor"
          placeholder="Buscar contenedor"
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            setPage(0);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          autoFocus
        />
        <View
          style={styles.options}
          accessibilityLabel="Contenedores de demostración"
        >
          {filtered.slice(current * 4, current * 4 + 4).map((option) => {
            const selected = option.value === value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: selected }}
                onPress={() => onSelect(option.value)}
              >
                <Surface
                  fullWidth
                  bordered
                  padding="sm"
                  radius="control"
                  style={[
                    styles.option,
                    selected && {
                      borderColor: theme.colors.success.main,
                      backgroundColor: theme.colors.success.bg,
                      borderLeftWidth: 3,
                    },
                  ]}
                >
                  <View style={styles.optionHead}>
                    <Text variant="label" weight="bold" style={styles.code}>
                      {option.label}
                    </Text>
                    <Chip
                      variant="soft"
                      appearance="status"
                      tone={
                        selected
                          ? 'success'
                          : option.location === 'En finca'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {selected ? 'Seleccionado' : option.location}
                    </Chip>
                  </View>
                  <Text variant="caption" color="secondary">
                    {option.operation} - {option.journey} - {option.vehicle}
                  </Text>
                </Surface>
              </Pressable>
            );
          })}
          {filtered.length === 0 && (
            <Text
              variant="helper"
              color="secondary"
              align="center"
              style={styles.empty}
            >
              Sin resultados para la búsqueda.
            </Text>
          )}
        </View>
        <Text variant="caption" color="tertiary">
          Datos de demostración de la propuesta.
        </Text>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  content: { gap: 10 },
  options: { gap: 8 },
  option: { gap: 6, minHeight: 68 },
  optionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  code: { flex: 1, minWidth: 0 },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pageButton: { flex: 1, minWidth: 0 },
  pageStatus: { flex: 1.4 },
  empty: { paddingVertical: 20 },
});
