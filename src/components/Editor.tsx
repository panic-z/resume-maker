import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[markdown()]}
        height="100%"
        className="flex-1 overflow-auto"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
      />
    </div>
  );
}
