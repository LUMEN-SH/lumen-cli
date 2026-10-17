{{clientDirective}}
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { {{nameCamel}}Schema, type {{Name}}FormValues } from './{{name}}.schema';
{{serviceImport}}
{{uiImports}}

export interface {{Name}}FormProps {
  defaultValues?: Partial<{{Name}}FormValues>;
  onSubmit?: (data: {{Name}}FormValues) => void | Promise<void>;
}

export function {{Name}}Form({ defaultValues, onSubmit }: {{Name}}FormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{{Name}}FormValues>({
    resolver: zodResolver({{nameCamel}}Schema),
    defaultValues: {
      title: '',
      description: '',
      ...defaultValues,
    },
  });

  const handleFormSubmit = async (data: {{Name}}FormValues) => {
{{serviceCall}}    if (onSubmit) {
      await onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="{{formClassName}}">
      <div className="{{fieldGroupClassName}}">
        <label htmlFor="{{nameKebab}}-title" className="{{labelClassName}}">
          Title
        </label>
        <input
          id="{{nameKebab}}-title"
          type="text"
          className="{{inputClassName}}"
          {...register('title')}
        />
        {errors.title && (
          <p className="{{errorClassName}}">{errors.title.message}</p>
        )}
      </div>

      <div className="{{fieldGroupClassName}}">
        <label htmlFor="{{nameKebab}}-description" className="{{labelClassName}}">
          Description
        </label>
        <textarea
          id="{{nameKebab}}-description"
          className="{{inputClassName}}"
          {...register('description')}
        />
        {errors.description && (
          <p className="{{errorClassName}}">{errors.description.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="{{buttonClassName}}">
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
