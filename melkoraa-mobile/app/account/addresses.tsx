import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AddressForm } from "@/src/components/account/AddressForm";
import { AuthGate } from "@/src/components/auth/AuthGate";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { SafeScreen } from "@/src/components/ui/SafeScreen";
import { AppText } from "@/src/components/ui/AppText";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import type { AddressWrite } from "@/src/api/types/addresses";
import { useAddresses } from "@/src/hooks/use-addresses";
import { colors, radii, spacing } from "@/src/theme";
import { userFacingApiMessage } from "@/src/api/errors";

const emptyForm: AddressWrite = {
  name: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "IN",
  isDefault: false,
};

function AddressesContent() {
  const { addresses, loading, error, mutating, refresh, create, remove } = useAddresses();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressWrite>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleCreate() {
    setFormError(null);
    const result = await create(form);
    if (result.status === "success") {
      setShowForm(false);
      setForm(emptyForm);
    } else if (result.status === "error") {
      setFormError(userFacingApiMessage(new Error(result.message)));
    }
  }

  if (loading) {
    return <AppText muted style={styles.pad}>Loading addresses…</AppText>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {addresses.map((address) => (
        <View key={address.id} style={styles.card}>
          <AppText variant="h3">{address.name}</AppText>
          <AppText muted>
            {address.addressLine1}
            {address.addressLine2 ? `, ${address.addressLine2}` : ""}
          </AppText>
          <AppText muted>
            {address.city}, {address.state} {address.postalCode}
          </AppText>
          {address.isDefault ? <AppText variant="caption">Default</AppText> : null}
          <Button label="Remove" variant="ghost" onPress={() => remove(address.id)} />
        </View>
      ))}

      {showForm ? (
        <View style={styles.card}>
          <AddressForm
            value={form}
            onChange={setForm}
            onSubmit={handleCreate}
            submitting={mutating}
          />
          {formError ? <AppText color={colors.error}>{formError}</AppText> : null}
          <Pressable onPress={() => setShowForm(false)}>
            <AppText muted>Cancel</AppText>
          </Pressable>
        </View>
      ) : (
        <Button label="Add address" variant="secondary" onPress={() => setShowForm(true)} />
      )}
    </ScrollView>
  );
}

export default function AddressesScreen() {
  return (
    <AuthGate
      title="Addresses"
      message="Sign in to manage delivery addresses."
      headerTitle="Addresses">
      <SafeScreen padded={false} edges={["top"]}>
        <AppHeader back title="Addresses" showSearch={false} />
        <AddressesContent />
      </SafeScreen>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.lg },
  content: { padding: spacing.lg, gap: spacing.md },
  card: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
});
