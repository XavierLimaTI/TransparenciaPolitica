# Script seguro para iniciar Terraform para lifecycle S3
# Uso: execute neste diretório ou passe o caminho para o repositório
# Este script NÃO contém suas credenciais AWS — configure AWS_PROFILE ou AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY antes de rodar.

param(
  [string]$BucketName = "your-bucket-name",
  [string]$AwsRegion = "sa-east-1",
  [switch]$Apply
)

$tfvarsPath = Join-Path -Path (Get-Location) -ChildPath "terraform.tfvars"

Write-Host "Gerando $tfvarsPath com bucket=$BucketName e region=$AwsRegion"
@"
bucket = "$BucketName"
aws_region = "$AwsRegion"
"@ | Out-File -FilePath $tfvarsPath -Encoding UTF8

Write-Host "Rodando terraform init..."
terraform init

Write-Host "Rodando terraform plan (apenas leitura)..."
terraform plan -out=plan.out

if ($Apply) {
  Write-Host "Aplicando terraform apply (usando plan.out)"
  terraform apply "plan.out"
} else {
  Write-Host "Pronto. Para aplicar, reexecute com -Apply ou rode: terraform apply plan.out"
}
