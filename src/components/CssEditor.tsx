import CodeMirror from "@uiw/react-codemirror";
import { css } from "@codemirror/lang-css";

interface CssEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CssEditor({ value, onChange }: CssEditorProps) {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[css()]}
        height="100%"
        className="flex-1 overflow-auto"
        placeholder=".resume-name { color: red; }"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
      />
    </div>
  );
}
