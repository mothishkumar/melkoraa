import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import type { AddressWrite } from "@/src/api/types/addresses";
import { colors, radii, spacing } from "@/src/theme";

type AddressFormProps = {
  value: AddressWrite;
  onChange: (value: AddressWrite) => void;
  onSubmit: () => void;
  submitting?: boolean;
  submitLabel?: string;
};

export function AddressForm({
  value,
  onChange,
  onSubmit,
  submitting = false,
  submitLabel = "Save address",
}: AddressFormProps) {
  function update<K extends keyof AddressWrite>(key: K, next: AddressWrite[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} placeholder="Full name" value={value.name} onChangeText={(text) => update("name", text)} />
      <TextInput style={styles.input} placeholder="Phone" value={value.phone ?? ""} onChangeText={(text) => update("phone", text)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Address line 1" value={value.addressLine1} onChangeText={(text) => update("addressLine1", text)} />
      <TextInput style={styles.input} placeholder="Address line 2" value={value.addressLine2 ?? ""} onChangeText={(text) => update("addressLine2", text)} />
      <TextInput style={styles.input} placeholder="City" value={value.city} onChangeText={(text) => update("city", text)} />
      <TextInput style={styles.input} placeholder="State" value={value.state} onChangeText={(text) => update("state", text)} />
      <TextInput style={styles.input} placeholder="Postal code" value={value.postalCode} onChangeText={(text) => update("postalCode", text)} />
      <AppText variant="caption" muted>Country: {value.country}</AppText>
      <Button label={submitLabel} onPress={onSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
});
