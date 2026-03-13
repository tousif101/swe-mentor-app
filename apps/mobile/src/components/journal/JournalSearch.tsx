// apps/mobile/src/components/journal/JournalSearch.tsx
import React from 'react'
import { View, TextInput, Pressable, Text, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatFocusAreaTag } from '../../utils/formatters'

type JournalSearchProps = {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedTag: string | null
  availableTags: string[]
  onTagSelect: (tag: string | null) => void
}

export function JournalSearch({
  searchQuery,
  onSearchChange,
  selectedTag,
  availableTags,
  onTagSelect,
}: JournalSearchProps) {
  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          testID="journal-search-input"
          style={styles.searchInput}
          placeholder="Search entries..."
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => onSearchChange('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#6b7280" />
          </Pressable>
        )}
      </View>

      {/* Hashtag Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {/* All chip */}
        <Pressable
          style={[styles.chip, !selectedTag && styles.chipActive]}
          onPress={() => onTagSelect(null)}
        >
          <Text style={[styles.chipText, !selectedTag && styles.chipTextActive]}>All</Text>
        </Pressable>

        {/* Tag chips */}
        {availableTags.map((tag) => (
          <Pressable
            key={tag}
            testID={`filter-chip-${tag}`}
            style={[styles.chip, selectedTag === tag && styles.chipActive]}
            onPress={() => onTagSelect(selectedTag === tag ? null : tag)}
          >
            <Text style={[styles.chipText, selectedTag === tag && styles.chipTextActive]}>
              {formatFocusAreaTag(tag)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results count / clear filters */}
      {(searchQuery || selectedTag) && (
        <View style={styles.filterStatus}>
          <Pressable onPress={() => { onSearchChange(''); onTagSelect(null); }}>
            <Text style={styles.clearFilters}>Clear filters</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8b5cf6',
  },
  chipText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  chipTextActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },
  filterStatus: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  clearFilters: {
    color: '#a78bfa',
    fontSize: 14,
  },
})
