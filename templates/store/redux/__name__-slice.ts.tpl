import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface {{Name}}State {
  value: number;
}

const initialState: {{Name}}State = {
  value: 0,
};

export const {{nameCamel}}Slice = createSlice({
  name: '{{nameCamel}}',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    setValue: (state, action: PayloadAction<number>) => {
      state.value = action.payload;
    },
    reset: (state) => {
      state.value = 0;
    },
  },
});

export const { increment, decrement, setValue, reset } = {{nameCamel}}Slice.actions;
export default {{nameCamel}}Slice.reducer;

/**
 * Typed hooks integration note:
 * Add this slice reducer to your root store configureStore({ reducer: { {{nameCamel}}: {{nameCamel}}Slice.reducer } }).
 * Access state via typed hooks: useAppSelector((state) => state.{{nameCamel}})
 * Dispatch actions via typed hooks: const dispatch = useAppDispatch(); dispatch(increment());
 */
