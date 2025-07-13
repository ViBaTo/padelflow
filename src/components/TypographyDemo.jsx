import React from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardContent
} from './ui/Card'
import { Heading, Text, Muted, Lead } from './ui/Typography'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Alert } from './ui/Alert'

export function TypographyDemo() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Demo de Card con Header */}
        <Card>
          <CardHeader>
            <CardTitle>Demo de Tipografía con Nunito Sans</CardTitle>
            <CardSubtitle>
              Prueba todos los estilos de texto en el nuevo sistema de diseño
            </CardSubtitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Headings */}
            <div>
              <Muted className='mb-4'>Títulos (Headings)</Muted>
              <div className='space-y-3'>
                <Heading level={1}>Heading 1 - Nunito Sans</Heading>
                <Heading level={2}>Heading 2 - Nunito Sans</Heading>
                <Heading level={3}>Heading 3 - Nunito Sans</Heading>
                <Heading level={4}>Heading 4 - Nunito Sans</Heading>
                <Heading level={5}>Heading 5 - Nunito Sans</Heading>
                <Heading level={6}>Heading 6 - Nunito Sans</Heading>
              </div>
            </div>

            {/* Párrafos */}
            <div>
              <Muted className='mb-4'>Párrafos</Muted>
              <div className='space-y-4'>
                <Lead>
                  Este es un párrafo lead que destaca información importante.
                  Nunito Sans ofrece excelente legibilidad y un diseño moderno.
                </Lead>
                <Text>
                  Este es un párrafo regular con Nunito Sans. La fuente se ve
                  limpia y profesional, perfecta para aplicaciones de gestión
                  como PadelFlow.
                </Text>
                <Text variant='caption'>
                  Este es texto caption, ideal para información secundaria y
                  descripciones breves.
                </Text>
                <Text variant='small'>
                  Este es texto small, perfecto para footers y información
                  adicional.
                </Text>
                <Muted>
                  Este es texto muted, usado para información menos importante.
                </Muted>
              </div>
            </div>

            {/* Componentes de UI */}
            <div>
              <Muted className='mb-4'>Componentes de UI</Muted>
              <div className='space-y-4'>
                <Button>Botón Principal con Nunito Sans</Button>
                <Button variant='secondary'>Botón Secundario</Button>

                <Input
                  label='Campo de texto'
                  placeholder='Texto con Nunito Sans'
                  helperText='Este es texto de ayuda con la nueva fuente'
                />

                <Alert variant='success' title='Éxito'>
                  Este es un mensaje de éxito usando Nunito Sans
                </Alert>

                <Alert variant='info' title='Información'>
                  Los componentes ahora usan Nunito Sans de forma consistente
                </Alert>
              </div>
            </div>

            {/* Ejemplo de lista */}
            <div>
              <Muted className='mb-4'>Lista de ejemplo</Muted>
              <ul className='space-y-2 list-disc list-inside font-sans text-gray-900 dark:text-white'>
                <li>Gestión completa de instalaciones</li>
                <li>Control de alumnos y profesores</li>
                <li>Reservas y pagos automatizados</li>
                <li>Interfaz moderna con Nunito Sans</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Información sobre la fuente */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre Nunito Sans</CardTitle>
            <CardSubtitle>
              Características de la nueva tipografía del sistema
            </CardSubtitle>
          </CardHeader>
          <CardContent>
            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <Heading level={4} className='mb-3'>
                  Ventajas
                </Heading>
                <ul className='space-y-2 font-sans text-gray-900 dark:text-white'>
                  <li>• Excelente legibilidad en pantallas</li>
                  <li>• Diseño moderno y profesional</li>
                  <li>• Múltiples pesos disponibles</li>
                  <li>• Optimizada para interfaces web</li>
                  <li>• Compatible con dark mode</li>
                </ul>
              </div>
              <div>
                <Heading level={4} className='mb-3'>
                  Pesos Disponibles
                </Heading>
                <div className='space-y-2 font-sans text-gray-900 dark:text-white'>
                  <div style={{ fontWeight: 200 }}>200 - Extra Light</div>
                  <div style={{ fontWeight: 300 }}>300 - Light</div>
                  <div style={{ fontWeight: 400 }}>400 - Regular</div>
                  <div style={{ fontWeight: 500 }}>500 - Medium</div>
                  <div style={{ fontWeight: 600 }}>600 - SemiBold</div>
                  <div style={{ fontWeight: 700 }}>700 - Bold</div>
                  <div style={{ fontWeight: 800 }}>800 - ExtraBold</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
