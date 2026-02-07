'use client';
import React from 'react';
import { instrument } from '../../lib/fonts';
import Container from '../../components/ui/Container';
import Section from '../../components/ui/Section';
import Button from '../../components/ui/Button';
import Chip from '../../components/ui/Chip';
import Card from '../../components/ui/Card';
import Divider from '../../components/ui/Divider';
import IconButton from '../../components/ui/IconButton';

export default function DemoPage() {
  return (
    <div className={`${instrument.variable} font-sans`}>
      <Container className="py-12">
        <header className="mb-12">
          <h1 className="text-3xl md:text-5xl font-bold">Parabolica UI — Component preview</h1>
          <p className="mt-3 text-muted-foreground">Foundational tokens and components.</p>
        </header>

        <Section id="buttons" className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex gap-4 items-center">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
        </Section>

        <Section id="chips" className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Chips</h2>
          <div className="flex gap-3">
            <Chip>Design</Chip>
            <Chip>Engineering</Chip>
            <Chip>Growth</Chip>
          </div>
        </Section>

        <Section id="cards" className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Card</h2>
          <Card>
            <h3 className="text-lg font-semibold">Card title</h3>
            <p className="mt-2 text-sm text-gray-600">Short description inside a card.</p>
            <div className="mt-4 flex gap-3">
              <Button size="sm">Action</Button>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
            </div>
          </Card>
        </Section>

        <Section id="divider" className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Divider</h2>
          <Divider />
        </Section>

        <Section id="iconbutton" className="mb-10">
          <h2 className="text-xl font-semibold mb-4">IconButton</h2>
          <IconButton label="Close" />
        </Section>
      </Container>
    </div>
  );
}

