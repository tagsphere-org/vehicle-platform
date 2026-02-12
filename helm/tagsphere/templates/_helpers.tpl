{{/*
Common labels
*/}}
{{- define "tagsphere.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: tagsphere
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Full image path with optional registry
*/}}
{{- define "tagsphere.image" -}}
{{- if .global.imageRegistry -}}
{{ .global.imageRegistry }}/{{ .image.repository }}:{{ .image.tag }}
{{- else -}}
{{ .image.repository }}:{{ .image.tag }}
{{- end -}}
{{- end }}
