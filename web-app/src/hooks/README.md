# Custom Hooks Documentation

This directory contains reusable custom hooks for the Banking System web application.

## Available Hooks

### `useApi<T>`
A generic hook for making API calls with built-in loading and error states.

```typescript
const { data, loading, error, execute, reset } = useApi<User>('/api/users', 'GET');
```

**Features:**
- Automatic loading state management
- Error handling with user-friendly messages
- Retry functionality
- Type-safe responses

### `useLocalStorage<T>`
A hook for managing localStorage with type safety and error handling.

```typescript
const [value, setValue, removeValue] = useLocalStorage<string>('user-preference', 'default');
```

**Features:**
- Type-safe storage
- Automatic JSON serialization/deserialization
- Cross-tab synchronization
- Error handling for corrupted data

### `useDebounce<T>`
A hook for debouncing values, useful for search inputs and API calls.

```typescript
const debouncedSearchTerm = useDebounce(searchTerm, 500);
```

**Features:**
- Configurable delay
- Automatic cleanup
- Type-safe implementation

### `useClickOutside`
A hook for detecting clicks outside of a specified element.

```typescript
const ref = useClickOutside(() => {
  // Handle click outside
});
```

**Features:**
- Supports both mouse and touch events
- Automatic cleanup
- Type-safe ref

### `useAuth`
Authentication context hook for managing user state and auth operations.

```typescript
const { user, login, logout, loading, error } = useAuth();
```

**Features:**
- JWT token management
- Auto-logout functionality
- 2FA support
- Session persistence

## Usage Examples

### API Call with Loading State
```typescript
import { useApi } from '../hooks/useApi';

const UserProfile = () => {
  const { data: user, loading, error, execute } = useApi<User>('/api/user/profile');

  useEffect(() => {
    execute();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  
  return <UserCard user={user} />;
};
```

### Debounced Search
```typescript
import { useDebounce } from '../hooks/useDebounce';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search API call
      searchUsers(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search users..."
    />
  );
};
```

### Local Storage Management
```typescript
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeToggle = () => {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
};
```

## Best Practices

1. **Always provide fallback values** for localStorage hooks
2. **Use appropriate debounce delays** (300-500ms for search, 1000ms for expensive operations)
3. **Handle loading and error states** in your components
4. **Clean up subscriptions** in useEffect cleanup functions
5. **Use TypeScript generics** for type safety

## Error Handling

All hooks include built-in error handling:
- API errors are automatically caught and formatted
- LocalStorage errors are logged but don't crash the app
- Network errors are handled gracefully with retry options

## Performance Considerations

- Hooks are optimized with `useCallback` and `useMemo` where appropriate
- Debounced values prevent excessive API calls
- LocalStorage changes are batched to prevent excessive writes
- API calls can be cancelled to prevent memory leaks 