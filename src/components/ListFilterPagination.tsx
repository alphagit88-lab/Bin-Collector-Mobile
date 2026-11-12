import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  page: number; totalPages: number; startDate: Date | null; endDate: Date | null;
  onPageChange: (page: number) => void;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  showDates?: boolean;
  showPagination?: boolean;
};

export default function ListFilterPagination(props: Props) {
  const [picker, setPicker] = useState<'start' | 'end' | null>(null);
  const select = (event: DateTimePickerEvent, value?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type !== 'set' || !value || !picker) return;
    picker === 'start' ? props.onStartDateChange(value) : props.onEndDateChange(value);
  };
  const format = (date: Date | null) => date ? date.toLocaleDateString() : 'Select date';
  const pages = Math.max(1, props.totalPages);
  return <View style={styles.wrapper}>
    {props.showDates !== false && <View style={styles.dates}>
      <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('start')}><Text style={styles.label}>Start Date</Text><Text>{format(props.startDate)}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.dateButton} onPress={() => setPicker('end')}><Text style={styles.label}>End Date</Text><Text>{format(props.endDate)}</Text></TouchableOpacity>
      {(props.startDate || props.endDate) && <TouchableOpacity onPress={() => { props.onStartDateChange(null); props.onEndDateChange(null); }}><Text style={styles.clear}>Clear</Text></TouchableOpacity>}
    </View>}
    {props.showDates !== false && picker && <DateTimePicker value={(picker === 'start' ? props.startDate : props.endDate) || new Date()} mode="date" onChange={select} maximumDate={picker === 'start' ? props.endDate || undefined : undefined} minimumDate={picker === 'end' ? props.startDate || undefined : undefined} />}
    {props.showPagination !== false && <View style={styles.pagination}>
      <TouchableOpacity disabled={props.page <= 1} onPress={() => props.onPageChange(props.page - 1)} style={[styles.pageButton, props.page <= 1 && styles.disabled]}><Text>Previous</Text></TouchableOpacity>
      <Text>Page {props.page} of {pages}</Text>
      <TouchableOpacity disabled={props.page >= pages} onPress={() => props.onPageChange(props.page + 1)} style={[styles.pageButton, props.page >= pages && styles.disabled]}><Text>Next</Text></TouchableOpacity>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, paddingVertical: 12 }, dates: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, flexWrap: 'wrap' },
  dateButton: { flexGrow: 1, minWidth: 130, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10, backgroundColor: '#FFF' },
  label: { color: '#6B7280', fontSize: 11, marginBottom: 3 }, clear: { color: '#059669', padding: 10 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  pageButton: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' }, disabled: { opacity: 0.4 },
});
